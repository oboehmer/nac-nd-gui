#!/usr/bin/env python3
"""
Memory Log Processing Script
Processes pending log entries and updates memory files appropriately.
"""

import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any

def load_log_file(log_path: Path) -> Dict[str, Any]:
    """Load the current log file."""
    with open(log_path, 'r') as f:
        return json.load(f)

def get_pending_entries(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract pending entries from log data."""
    entries = data.get('entries', [])
    if isinstance(entries, list):
        return [e for e in entries if isinstance(e, dict) and e.get('processing_status') == 'pending']
    return []

def analyze_tool_execution(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze tool execution data to determine memory worthiness."""
    tool_data = entry.get('tool_data', {})
    tool_name = tool_data.get('tool_name', 'Unknown')
    tool_input = tool_data.get('tool_input', {})
    tool_response = tool_data.get('tool_response', {})

    analysis = {
        'tool_name': tool_name,
        'timestamp': entry.get('timestamp'),
        'memory_worthy': False,
        'category': None,
        'content': None
    }

    # Meta-memory operations (administrative work)
    if tool_name == 'Bash':
        command = tool_input.get('command', '')
        description = tool_input.get('description', '')

        # Check if this is memory system administrative work
        if 'memory_logs' in command or 'archive' in command or 'au-promotion' in command:
            analysis['memory_worthy'] = False
            analysis['category'] = 'meta-memory-admin'
            analysis['content'] = 'Memory system administrative operations'
            return analysis

    # Edit operations on memory files
    if tool_name == 'Edit':
        file_path = tool_input.get('file_path', '')
        if 'memory' in file_path and 'session-history' in file_path:
            analysis['memory_worthy'] = False
            analysis['category'] = 'meta-memory-admin'
            analysis['content'] = 'Session history update by au-promotion'
            return analysis

    # Task tool usage
    if tool_name == 'Task':
        analysis['memory_worthy'] = False
        analysis['category'] = 'meta-memory-admin'
        analysis['content'] = 'Task management operations'
        return analysis

    # Write operations
    if tool_name == 'Write':
        file_path = tool_input.get('file_path', '')
        if '.claude' in file_path or 'memory' in file_path:
            analysis['memory_worthy'] = False
            analysis['category'] = 'meta-memory-admin'
            analysis['content'] = 'Memory file write operations'
            return analysis

    return analysis

def archive_processed_entries(entries: List[Dict[str, Any]], archive_dir: Path, session_name: str = "current") -> Path:
    """Archive processed entries to archive directory."""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    archive_file = archive_dir / f"processed_{timestamp}.json"

    archive_data = {
        'archived_at': datetime.now(timezone.utc).isoformat(),
        'archived_by': 'au-update',
        'session': session_name,
        'entry_count': len(entries),
        'entries': entries
    }

    with open(archive_file, 'w') as f:
        json.dump(archive_data, f, indent=2)

    return archive_file

def main():
    """Main processing function."""
    # Paths
    log_file = Path('/Users/rmuller/dev/nac-nd-gui/.claude/memory_logs/current.json')
    archive_dir = Path('/Users/rmuller/dev/nac-nd-gui/.claude/memory_logs/archive')
    archive_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 80)
    print("Memory Log Processing - au-update Agent")
    print("=" * 80)
    print()

    # Load log file
    print(f"Reading log file: {log_file}")
    data = load_log_file(log_file)

    # Get pending entries
    pending = get_pending_entries(data)
    print(f"Found {len(pending)} pending entries")
    print()

    if not pending:
        print("No pending entries to process.")
        return

    # Analyze each entry
    print("Analyzing entries:")
    print("-" * 80)

    memory_updates = []
    meta_operations = []

    for i, entry in enumerate(pending, 1):
        analysis = analyze_tool_execution(entry)
        print(f"{i}. {analysis['tool_name']} - {analysis['timestamp']}")
        print(f"   Category: {analysis['category']}")
        print(f"   Content: {analysis['content']}")
        print()

        if analysis['category'] == 'meta-memory-admin':
            meta_operations.append(entry)
        elif analysis['memory_worthy']:
            memory_updates.append(entry)

    print("=" * 80)
    print("Processing Summary:")
    print(f"  Meta-memory operations: {len(meta_operations)}")
    print(f"  Memory-worthy updates: {len(memory_updates)}")
    print("=" * 80)
    print()

    # Mark all as completed
    for entry in pending:
        entry['processing_status'] = 'completed'
        entry['processed_by'] = 'au-update'
        entry['processed_at'] = datetime.now(timezone.utc).isoformat()

    # Archive processed entries
    if pending:
        archive_file = archive_processed_entries(
            pending,
            archive_dir,
            "Session 15+ - au-update processing"
        )
        print(f"Archived {len(pending)} entries to: {archive_file.name}")

        # Clean current log
        data['entries'] = []
        if 'metadata' not in data:
            data['metadata'] = {}
        data['metadata']['last_processed'] = datetime.now(timezone.utc).isoformat()
        data['metadata']['processed_by'] = 'au-update'
        data['metadata']['last_archive'] = archive_file.name

        with open(log_file, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"Cleaned current log file")
        print()

    print("=" * 80)
    print("Processing Complete")
    print("=" * 80)

if __name__ == '__main__':
    main()
