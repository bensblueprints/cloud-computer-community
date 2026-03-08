#!/bin/bash
# CloudCode AI - Quick access to Mistral, Llama, Qwen, Gemma
# Usage: ai "your prompt here"
#        ai chat  (interactive mode)
#        ai models (list available models)

OLLAMA="http://10.10.10.1:11434"
MODEL="${AI_MODEL:-mistral}"

if [ "$1" = "models" ]; then
    echo "Available AI Models:"
    curl -s "$OLLAMA/api/tags" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for m in data.get('models',[]):
    size=m['details']['parameter_size']
    print(f'  - {m[\"name\"]} ({size})')
" 2>/dev/null || curl -s "$OLLAMA/api/tags"
    echo ""
    echo "Set default: export AI_MODEL=llama3.2:3b"
    exit 0
fi

if [ "$1" = "chat" ]; then
    echo "CloudCode AI Chat (model: $MODEL)"
    echo "Type your message, press Enter to send. Ctrl+C to quit."
    echo "---"
    while true; do
        printf "\033[36mYou:\033[0m "
        read -r PROMPT
        [ -z "$PROMPT" ] && continue
        printf "\033[33mAI:\033[0m "
        curl -s "$OLLAMA/api/generate" -d "{\"model\":\"$MODEL\",\"prompt\":\"$PROMPT\",\"stream\":true}" 2>/dev/null | while read -r line; do
            echo "$line" | python3 -c "import sys,json;print(json.load(sys.stdin).get('response',''),end='',flush=True)" 2>/dev/null
        done
        echo ""
    done
    exit 0
fi

if [ -z "$1" ]; then
    echo "CloudCode AI - Free AI on your cloud computer"
    echo ""
    echo "Usage:"
    echo "  ai \"What is Docker?\"     Quick question"
    echo "  ai chat                   Interactive chat"
    echo "  ai models                 List available models"
    echo ""
    echo "Models: mistral (default), llama3.2:3b, qwen2.5:3b, gemma2:2b"
    echo "Change model: export AI_MODEL=llama3.2:3b"
    echo ""
    echo "API Endpoint: http://10.10.10.1:11434"
    echo "  curl http://10.10.10.1:11434/api/generate -d '{\"model\":\"mistral\",\"prompt\":\"Hello\"}'"
    exit 0
fi

# One-shot prompt
PROMPT="$*"
curl -s "$OLLAMA/api/generate" -d "{\"model\":\"$MODEL\",\"prompt\":\"$PROMPT\",\"stream\":true}" 2>/dev/null | while read -r line; do
    echo "$line" | python3 -c "import sys,json;print(json.load(sys.stdin).get('response',''),end='',flush=True)" 2>/dev/null
done
echo ""
