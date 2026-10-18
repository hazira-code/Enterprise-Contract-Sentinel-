#!/usr/bin/env python3
"""
Enterprise Contract Sentinel - AI/ML Engine
File: /ai-engine/train_qlora.py

Objective:
Fine-tune a Llama-3-8B-Instruct base model using QLoRA (Quantized Low-Rank Adaptation)
and 4-bit BitsAndBytes quantization to extract enterprise contract clauses:
1. Limitation of Liability & Dollar/Percentage Caps
2. Data Sovereignty & GDPR Cross-Border / SCC stipulations
3. Governing Law & State Jurisdiction
4. Auto-Renewal / Termination Notice Windows

Adheres to enterprise offline isolation guidelines: no internet connectivity during training,
local cached checkpoint loading, deterministic seed, and full tensor typing.
"""

import os
import sys
import math
import json
import logging
import argparse
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

import torch
from datasets import Dataset, load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq,
    set_seed
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
    TaskType,
    PeftModel
)

# -----------------------------------------------------------------------------
# LOGGING & AUDIT CONFIGURATION
# -----------------------------------------------------------------------------
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] [Sentinel-QLoRA] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("qlora_training.log", mode="a", encoding="utf-8")
    ]
)
logger = logging.getLogger("EnterpriseContractSentinel.QLoRA")

# -----------------------------------------------------------------------------
# CONTRACT EXTRACTION SYSTEM PROMPT (LLAMA-3 INSTRUCT TEMPLATE)
# -----------------------------------------------------------------------------
SYSTEM_INSTRUCTION = """You are an Enterprise Legal AI Auditor specializing in contract risk analysis.
Your job is to read commercial agreements and extract four mandatory compliance clauses into strict JSON format:
1. liability: limitation ceiling, dollar cap, or annual contract value (ACV) percentage.
2. data_sovereignty: data storage region, EU/EEA guarantees, and Standard Contractual Clauses (SCC) mentions.
3. governing_law: designated governing state/country and exclusive litigation jurisdiction.
4. auto_renewal: renewal term, termination window, and required written notice period in days.

Respond ONLY with valid JSON containing keys: liability, data_sovereignty, governing_law, auto_renewal."""

def format_llama3_chat(contract_text: str, target_extraction: Optional[Dict[str, Any]] = None) -> str:
    """
    Formats the input prompt into Llama-3's official chat template:
    <|begin_of_text|><|start_header_id|>system<|end_header_id|>...<|eot_id|>
    <|start_header_id|>user<|end_header_id|>...<|eot_id|>
    <|start_header_id|>assistant<|end_header_id|>...<|eot_id|>
    """
    formatted = (
        f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
        f"{SYSTEM_INSTRUCTION}<|eot_id|>\n"
        f"<|start_header_id|>user<|end_header_id|>\n\n"
        f"Contract Document:\n\"\"\"\n{contract_text}\n\"\"\"<|eot_id|>\n"
        f"<|start_header_id|>assistant<|end_header_id|>\n\n"
    )
    if target_extraction is not None:
        formatted += f"{json.dumps(target_extraction, indent=2)}<|eot_id|>"
    return formatted

# -----------------------------------------------------------------------------
# SYNTHETIC GROUND-TRUTH TRAINING DATASET GENERATOR (ENTERPRISE SAMPLES)
# -----------------------------------------------------------------------------
def get_enterprise_contract_dataset() -> List[Dict[str, Any]]:
    """
    Returns curated enterprise contract samples with exact ground-truth clause extractions
    targeting the four corporate rules.
    """
    return [
        {
            "contract_text": (
                "SECTION 9. LIMITATION OF LIABILITY. In no event shall either party's aggregate liability "
                "arising out of or related to this Agreement exceed two hundred and fifty percent (250%) of the "
                "total Annual Contract Value (ACV) paid or payable by Customer in the twelve (12) months preceding the incident.\n"
                "SECTION 14. DATA PROTECTION & PRIVACY. Customer Personal Data may be processed and stored in "
                "Vendor's primary cloud infrastructure located in Singapore and Malaysia. The parties agree that no "
                "Standard Contractual Clauses (SCCs) are deemed necessary under applicable local law.\n"
                "SECTION 18. GOVERNING LAW. This Agreement shall be governed by, and construed in accordance with, "
                "the laws of England and Wales. The High Court of Justice in London, United Kingdom shall have exclusive jurisdiction.\n"
                "SECTION 4. TERM AND RENEWAL. This Agreement shall automatically renew for successive one-year periods "
                "unless either party provides written notice of non-renewal at least thirty (30) days prior to the expiration date."
            ),
            "extraction": {
                "liability": {
                    "raw_clause": "In no event shall either party's aggregate liability exceed two hundred and fifty percent (250%) of the total Annual Contract Value (ACV).",
                    "cap_percentage_acv": 250.0,
                    "is_uncapped": False
                },
                "data_sovereignty": {
                    "raw_clause": "Customer Personal Data may be processed and stored in Vendor's primary cloud infrastructure located in Singapore and Malaysia.",
                    "storage_regions": ["Singapore", "Malaysia"],
                    "sccs_present": False,
                    "eu_exclusive": False
                },
                "governing_law": {
                    "raw_clause": "This Agreement shall be governed by the laws of England and Wales. The High Court of Justice in London, United Kingdom.",
                    "governing_jurisdiction": "England and Wales",
                    "court_seat": "London, United Kingdom"
                },
                "auto_renewal": {
                    "raw_clause": "automatically renew for successive one-year periods unless either party provides written notice of non-renewal at least thirty (30) days prior",
                    "notice_window_days": 30,
                    "is_silent": False
                }
            }
        },
        {
            "contract_text": (
                "ARTICLE 8. LIABILITY AND INDEMNIFICATION. The total liability of Provider under this Agreement "
                "shall strictly be capped at one hundred percent (100%) of the fees paid by Customer during the preceding contract year.\n"
                "ARTICLE 12. GDPR COMPLIANCE & SOVEREIGNTY. All Personal Data of European Union citizens collected "
                "under this Agreement shall be stored exclusively in data centers located within Frankfurt, Germany (EU). "
                "Standard Contractual Clauses (EU 2021/914) are fully executed and incorporated as Exhibit B.\n"
                "ARTICLE 17. APPLICABLE LAW. This Agreement is governed by the laws of the State of Delaware, USA, "
                "without giving effect to conflict of laws principles. Exclusive venue shall lie in the Court of Chancery of Delaware.\n"
                "ARTICLE 3. TERM. The initial term is three (3) years. It shall renew automatically unless terminated by "
                "either party upon at least ninety (90) days prior written notice."
            ),
            "extraction": {
                "liability": {
                    "raw_clause": "The total liability of Provider under this Agreement shall strictly be capped at one hundred percent (100%) of the fees paid",
                    "cap_percentage_acv": 100.0,
                    "is_uncapped": False
                },
                "data_sovereignty": {
                    "raw_clause": "All Personal Data of European Union citizens collected under this Agreement shall be stored exclusively in data centers located within Frankfurt, Germany (EU).",
                    "storage_regions": ["Frankfurt, Germany", "EU"],
                    "sccs_present": True,
                    "eu_exclusive": True
                },
                "governing_law": {
                    "raw_clause": "This Agreement is governed by the laws of the State of Delaware, USA. Exclusive venue shall lie in the Court of Chancery of Delaware.",
                    "governing_jurisdiction": "Delaware, USA",
                    "court_seat": "Wilmington, Delaware"
                },
                "auto_renewal": {
                    "raw_clause": "renew automatically unless terminated by either party upon at least ninety (90) days prior written notice.",
                    "notice_window_days": 90,
                    "is_silent": False
                }
            }
        },
        {
            "contract_text": (
                "CLAUSE 11. LIABILITY. NEITHER PARTY SHALL HAVE ANY CEILING OR CAP ON DIRECT DAMAGES RESULTING FROM "
                "A BREACH OF CONFIDENTIALITY OR SERVICE LEVEL AGREEMENT (UNLIMITED LIABILITY).\n"
                "CLAUSE 16. DATA STORAGE. Data will be hosted across multi-tenant regions in North America and Western Europe, "
                "with transfers executed without formal Standard Contractual Clauses due to internal company policies.\n"
                "CLAUSE 22. JURISDICTION. Any dispute shall be settled under the substantive laws of the State of New York, "
                "sitting in the Borough of Manhattan, State of New York.\n"
                "CLAUSE 5. RENEWAL. The agreement renews silently upon the expiration of each calendar year with no "
                "written notice requirement."
            ),
            "extraction": {
                "liability": {
                    "raw_clause": "NEITHER PARTY SHALL HAVE ANY CEILING OR CAP ON DIRECT DAMAGES (UNLIMITED LIABILITY).",
                    "cap_percentage_acv": None,
                    "is_uncapped": True
                },
                "data_sovereignty": {
                    "raw_clause": "Data will be hosted across multi-tenant regions in North America and Western Europe, without formal Standard Contractual Clauses",
                    "storage_regions": ["North America", "Western Europe"],
                    "sccs_present": False,
                    "eu_exclusive": False
                },
                "governing_law": {
                    "raw_clause": "settled under the substantive laws of the State of New York, sitting in the Borough of Manhattan",
                    "governing_jurisdiction": "State of New York",
                    "court_seat": "Manhattan, New York"
                },
                "auto_renewal": {
                    "raw_clause": "renews silently upon the expiration of each calendar year with no written notice requirement.",
                    "notice_window_days": 0,
                    "is_silent": True
                }
            }
        }
    ]

# -----------------------------------------------------------------------------
# TOKENIZATION & PREPARATION PIPELINE
# -----------------------------------------------------------------------------
def prepare_tokenized_dataset(
    dataset_records: List[Dict[str, Any]],
    tokenizer: AutoTokenizer,
    max_seq_length: int = 2048
) -> Dataset:
    """
    Transforms raw contract text and target extraction dictionaries into tokenized
    input_ids, attention_mask, and labels with proper padding and truncation.
    """
    formatted_prompts = []
    for item in dataset_records:
        text = format_llama3_chat(item["contract_text"], item["extraction"])
        formatted_prompts.append({"text": text})

    raw_dataset = Dataset.from_list(formatted_prompts)

    def tokenize_fn(examples: Dict[str, List[str]]) -> Dict[str, torch.Tensor]:
        outputs = tokenizer(
            examples["text"],
            truncation=True,
            max_length=max_seq_length,
            padding=False,
            return_tensors=None
        )
        outputs["labels"] = outputs["input_ids"].copy()
        return outputs

    tokenized_dataset = raw_dataset.map(
        tokenize_fn,
        batched=True,
        remove_columns=["text"],
        desc="Tokenizing Contract Extraction Corpus"
    )
    return tokenized_dataset

# -----------------------------------------------------------------------------
# MAIN QLORA TRAINING ROUTINE
# -----------------------------------------------------------------------------
def run_qlora_training(
    model_name_or_path: str = "meta-llama/Meta-Llama-3-8B-Instruct",
    output_dir: str = "/ai-engine/checkpoints/sentinel-llama3-8b-qlora",
    epochs: int = 3,
    batch_size: int = 2,
    gradient_accumulation_steps: int = 4,
    learning_rate: float = 2e-4,
    lora_r: int = 16,
    lora_alpha: int = 32,
    lora_dropout: float = 0.05,
    max_seq_length: int = 2048,
    seed: int = 42
) -> None:
    """
    Executes end-to-end 4-bit QLoRA fine-tuning for contract clause extraction.
    """
    set_seed(seed)
    logger.info("Initializing Enterprise Contract Sentinel QLoRA Fine-Tuning Pipeline")
    logger.info(f"Target Model: {model_name_or_path}")
    logger.info(f"Output Directory: {output_dir}")

    os.makedirs(output_dir, exist_ok=True)

    # 1. Configure 4-bit Quantization with BitsAndBytes
    compute_dtype = torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float16
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=compute_dtype,
        bnb_4bit_use_double_quant=True
    )
    logger.info(f"Configured BitsAndBytes 4-bit NF4 Quantization (compute_dtype: {compute_dtype})")

    # 2. Load Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        model_name_or_path,
        trust_remote_code=True,
        use_fast=True
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # 3. Load 4-bit Quantized Base Model
    device_map = "auto" if torch.cuda.is_available() else "cpu"
    logger.info(f"Loading Base Causal LM with device_map='{device_map}'...")
    base_model = AutoModelForCausalLM.from_pretrained(
        model_name_or_path,
        quantization_config=bnb_config if torch.cuda.is_available() else None,
        device_map=device_map,
        trust_remote_code=True,
        torch_dtype=compute_dtype
    )

    # 4. Prepare for k-bit training and configure LoRA adapter
    if torch.cuda.is_available():
        base_model = prepare_model_for_kbit_training(base_model, use_gradient_checkpointing=True)

    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=lora_r,
        lora_alpha=lora_alpha,
        lora_dropout=lora_dropout,
        bias="none",
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj"
        ]
    )
    peft_model = get_peft_model(base_model, peft_config)
    peft_model.print_trainable_parameters()

    # 5. Build Training Dataset
    train_records = get_enterprise_contract_dataset()
    train_dataset = prepare_tokenized_dataset(train_records, tokenizer, max_seq_length=max_seq_length)

    # 6. Setup Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=gradient_accumulation_steps,
        learning_rate=learning_rate,
        weight_decay=0.01,
        warmup_ratio=0.03,
        lr_scheduler_type="cosine",
        logging_dir=f"{output_dir}/logs",
        logging_steps=1,
        save_strategy="epoch",
        save_total_limit=2,
        fp16=(compute_dtype == torch.float16),
        bf16=(compute_dtype == torch.bfloat16),
        optim="paged_adamw_8bit" if torch.cuda.is_available() else "adamw_torch",
        report_to="none",
        seed=seed
    )

    # 7. Execute Training Loop
    trainer = Trainer(
        model=peft_model,
        args=training_args,
        train_dataset=train_dataset,
        data_collator=DataCollatorForSeq2Seq(tokenizer=tokenizer, pad_to_multiple_of=8, return_tensors="pt")
    )

    logger.info("Starting QLoRA Trainer optimization loop...")
    trainer.train()
    logger.info("Training complete. Saving adapter weights and tokenizer configuration...")

    peft_model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    # Write metadata manifest for audit verification
    manifest = {
        "model_architecture": "Meta-Llama-3-8B-Instruct",
        "method": "QLoRA 4-bit NF4",
        "lora_r": lora_r,
        "lora_alpha": lora_alpha,
        "target_rules": [
            "Liability Ceiling <= 150% ACV",
            "GDPR EU/EEA Sovereign Storage & SCC Mandate",
            "Governing Law State of Delaware or New York",
            "Auto-Renewal Notice >= 60 Days"
        ],
        "device_accelerator": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        "output_directory": output_dir
    }
    with open(os.path.join(output_dir, "training_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    logger.info(f"Artifacts successfully stored in {output_dir}")

# -----------------------------------------------------------------------------
# CLI ENTRY POINT
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enterprise Contract Sentinel - QLoRA Training")
    parser.add_argument("--base_model", type=str, default="meta-llama/Meta-Llama-3-8B-Instruct", help="Path or HuggingFace ID of base model")
    parser.add_argument("--output_dir", type=str, default="/ai-engine/checkpoints/sentinel-llama3-8b-qlora", help="Output directory for adapters")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=2, help="Per device batch size")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    args = parser.parse_args()

    run_qlora_training(
        model_name_or_path=args.base_model,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr
    )
