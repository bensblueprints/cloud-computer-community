#!/bin/bash
# Push AI command + updated welcome to all running customer VMs
# Run from Proxmox host: bash /root/cloud-computer-community/scripts/push-ai-to-vms.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AI_CMD="$SCRIPT_DIR/ai-command.sh"

if [ ! -f "$AI_CMD" ]; then
    echo "ERROR: ai-command.sh not found at $AI_CMD"
    exit 1
fi

# Get all running QEMU VMs with VMID >= 1000 (customer VMs)
echo "Finding running customer VMs..."
RUNNING_VMS=$(pvesh get /nodes/proxmox/qemu --output-format json 2>/dev/null | python3 -c "
import sys,json
data=json.load(sys.stdin)
for vm in data:
    if vm.get('status')=='running' and int(vm['vmid'])>=1000:
        print(vm['vmid'])
" 2>/dev/null)

if [ -z "$RUNNING_VMS" ]; then
    echo "No running customer VMs found."
    exit 0
fi

echo "Running VMs: $RUNNING_VMS"

WELCOME_TEXT='Welcome to Cloud Computer!

Your cloud desktop comes pre-installed with:
  - Google Chrome & Firefox
  - Telegram Desktop
  - Cursor IDE
  - Claude Code CLI (run: claude in terminal)
  - AI Models (run: ai in terminal)

FREE AI ACCESS (no API key needed from your VM):
  Quick question:    ai "What is Docker?"
  Interactive chat:  ai chat
  List models:       ai models

  Available models: Mistral 7B, Llama 3.2, Qwen 2.5, Gemma2
  API endpoint: http://10.10.10.1:11434

  Use in your code:
    curl http://10.10.10.1:11434/api/generate -d '"'"'{"model":"mistral","prompt":"Hello"}'"'"'

IMPORTANT: Please change your password!
Open a terminal and run: passwd

For support visit: https://cloudcode.space'

for VMID in $RUNNING_VMS; do
    echo "--- VM $VMID ---"

    # Check if guest agent is responsive
    if ! pvesh get /nodes/proxmox/qemu/$VMID/agent/info > /dev/null 2>&1; then
        echo "  Skipped (guest agent not available)"
        continue
    fi

    # Copy ai command
    AI_CONTENT=$(cat "$AI_CMD" | base64 -w0)
    pvesh create /nodes/proxmox/qemu/$VMID/agent/exec \
        --command "bash" \
        --input-data "echo '$AI_CONTENT' | base64 -d > /usr/local/bin/ai && chmod +x /usr/local/bin/ai && echo 'ai command installed'" \
        > /dev/null 2>&1

    # Update welcome text
    pvesh create /nodes/proxmox/qemu/$VMID/agent/exec \
        --command "bash" \
        --input-data "cat > /home/cloudcomputer/Desktop/WELCOME.txt << 'ENDWELCOME'
$WELCOME_TEXT
ENDWELCOME
chown cloudcomputer:cloudcomputer /home/cloudcomputer/Desktop/WELCOME.txt 2>/dev/null
echo 'Welcome updated'" \
        > /dev/null 2>&1

    echo "  Done"
    sleep 1
done

echo "=== All VMs updated ==="
