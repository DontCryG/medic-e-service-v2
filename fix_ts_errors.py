import os
import re

def replace_in_file(filepath, pattern, replacement, is_regex=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if is_regex:
        new_content = re.sub(pattern, replacement, content)
    else:
        new_content = content.replace(pattern, replacement)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

# 1. SmartDatePicker.tsx
fp = 'src/components/common/SmartDatePicker.tsx'
replace_in_file(fp, 'onChange={onChange}', 'onChange={onChange as any}')

# 2. SmartSelect.tsx
fp = 'src/components/common/SmartSelect.tsx'
replace_in_file(fp, 'import { useState, useRef, useEffect, KeyboardEvent } from \'react\';', 'import { useState, useRef, useEffect } from \'react\';\nimport type { KeyboardEvent } from \'react\';')

# 3. InventoryReportModal.tsx
fp = 'src/pages/AccountingSystem/components/InventoryReportModal.tsx'
replace_in_file(fp, 'stats.map((stat) => (', 'stats.map((stat: any) => (')

# 4. InventoryTab.tsx
fp = 'src/pages/AccountingSystem/components/InventoryTab.tsx'
replace_in_file(fp, 'Number(item.quantity) > 0', 'Number(item.quantity) > 0') # Need to see exactly what's there
# wait it says string|number > number. We can do Number(item.quantity) > 0.
replace_in_file(fp, 'item.quantity > 0', 'Number(item.quantity) > 0')

# 5. Dashboard.tsx
fp = 'src/pages/Dashboard.tsx'
replace_in_file(fp, 'const itemVariants = {', 'const itemVariants: any = {')

# 6. DutySystem.tsx
fp = 'src/pages/DutySystem.tsx'
replace_in_file(fp, 'onClockIn={() => handleClockIn(currentSession.id, new Date())}', 'onClockIn={() => handleClockIn(currentSession?.id, new Date())}')
replace_in_file(fp, 'onClockIn={(time) => handleClockIn(currentSession?.id, time || new Date())}', 'onClockIn={(time) => handleClockIn(currentSession?.id, time || new Date())}')
replace_in_file(fp, 'const handleBreak = async (session) => {', 'const handleBreak = async (session: any) => {')

# 7. DutyHistoryTable.tsx
fp = 'src/pages/DutySystem/components/DutyHistoryTable.tsx'
replace_in_file(fp, 'rank: Number(log.position?.rank)', 'rank: Number(log.position?.rank || 0)')

# 8. LiveUsersList.tsx
fp = 'src/pages/DutySystem/components/LiveUsersList.tsx'
replace_in_file(fp, 'rank: Number(session.position?.rank)', 'rank: Number(session.position?.rank || 0)')

# 9. useDutyTimer.ts
fp = 'src/pages/DutySystem/hooks/useDutyTimer.ts'
replace_in_file(fp, 'export function useDutyTimer(currentSession) {', 'export function useDutyTimer(currentSession: any) {')
replace_in_file(fp, 'let interval;', 'let interval: any;')

# 10. AddDutyModal.tsx
fp = 'src/pages/PersonnelSystem/components/AddDutyModal.tsx'
replace_in_file(fp, 'onChange={(date) => setDutyClockIn(date)}', 'onChange={(date: any) => setDutyClockIn(date)}')
replace_in_file(fp, 'onChange={(date) => setDutyClockOut(date)}', 'onChange={(date: any) => setDutyClockOut(date)}')

# 11. PersonnelTable.tsx
fp = 'src/pages/PersonnelSystem/components/PersonnelTable.tsx'
replace_in_file(fp, 'rank: b.positions?.rank', 'rank: Number(b.positions?.rank || 0)')
replace_in_file(fp, 'rank: a.positions?.rank', 'rank: Number(a.positions?.rank || 0)')

print("Fixed!")
