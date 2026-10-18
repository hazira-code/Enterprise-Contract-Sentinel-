# AI Engine - Fine-Tuning & Evaluation

This directory contains the machine learning assets for the Enterprise Contract Sentinel:

- `train_qlora.py`: Fine-tunes `meta-llama/Meta-Llama-3-8B-Instruct` using 4-bit NormalFloat (NF4) BitsAndBytes quantization and PEFT LoRA adapters.
- `evaluate_ragas.py`: Benchmarks clause extraction precision, context recall, and faithfulness against ground-truth contract datasets.
- `requirements.txt`: Exact pinned ML library versions.
- `Dockerfile`: Isolated container with `TRANSFORMERS_OFFLINE=1`.

## QLoRA Hyperparameters
- Base Model: `meta-llama/Meta-Llama-3-8B-Instruct`
- Quantization: 4-bit NF4 with double quantization
- LoRA Rank (r): 16
- LoRA Alpha: 32
- Target Modules: `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`
- Learning Rate: `2e-4`
- Optimizer: `paged_adamw_8bit`
