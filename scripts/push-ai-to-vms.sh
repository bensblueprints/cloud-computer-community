#!/bin/bash
# Push AI command + hosts entry to all running customer VMs
# Run from Proxmox host: bash /root/cloud-computer-community/scripts/push-ai-to-vms.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AI_CMD="$SCRIPT_DIR/ai-command.sh"

if [ ! -f "$AI_CMD" ]; then
    echo "ERROR: ai-command.sh not found at $AI_CMD"
    exit 1
fi

# Get all running QEMU VMs with VMID >= 1000 (customer VMs)
echo "Finding running customer VMs..."
RUNNING_VMS=$(qm list 2>/dev/null | awk '$3 == "running" && $1 >= 1000 {print $1}')

if [ -z "$RUNNING_VMS" ]; then
    echo "No running customer VMs found."
    exit 0
fi

echo "Running VMs: $RUNNING_VMS"

AI_B64=$(base64 -w0 "$AI_CMD")

for VMID in $RUNNING_VMS; do
    echo "--- VM $VMID ---"

    # Install ai command via base64
    qm guest exec $VMID -- bash -c "echo $AI_B64 | base64 -d > /usr/local/bin/ai && chmod +x /usr/local/bin/ai && echo ai_installed" 2>/dev/null | grep -q "ai_installed" && echo "  ai command: OK" || echo "  ai command: FAILED"

    # Add ai.internal hosts entry
    qm guest exec $VMID -- bash -c "grep -q ai.internal /etc/hosts || echo '10.10.10.1 ai.internal' >> /etc/hosts && echo hosts_ok" 2>/dev/null | grep -q "hosts_ok" && echo "  hosts: OK" || echo "  hosts: FAILED"

    sleep 1
done

echo "=== All VMs updated ==="
