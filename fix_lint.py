import os
import re

def replace_in_file(filepath, pattern, replacement, is_regex=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if is_regex:
        new_content = re.sub(pattern, replacement, content)
    else:
        new_content = content.replace(pattern, replacement)
        
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

# 1. InventoryTab.tsx
fp = 'src/pages/AccountingSystem/components/InventoryTab.tsx'
replace_in_file(fp, 'ArrowDownToLine, ArrowUpFromLine, Clock, ArrowDown, ArrowUp', 'ArrowDownToLine, ArrowUpFromLine, Clock')

# 2. GangFamilySettings.tsx
fp = 'src/pages/SystemSettings/components/GangFamilySettings.tsx'
replace_in_file(fp, 'catch (err) {\n      alert', 'catch (err) {\n      console.error(err);\n      alert')
replace_in_file(fp, 'catch (err) {\n        alert', 'catch (err) {\n        console.error(err);\n        alert')

# 3. useQueue.ts
fp = 'src/pages/QueueSystem/hooks/useQueue.ts'
replace_in_file(fp, '(payload) => {', '() => {')

# 4. SalarySystem.tsx
fp = 'src/pages/SalarySystem.tsx'
replace_in_file(fp, 'export default function SalarySystem({ profile }: SalarySystemProps) {', 'export default function SalarySystem({ profile: _profile }: SalarySystemProps) {')

# 5. useDutyQueries.ts
fp = 'src/pages/DutySystem/hooks/useDutyQueries.ts'
replace_in_file(fp, 'const isAdmin = role === \'admin\' || role === \'director\' || role === \'management\';', '')

# 6. InventoryReportModal.tsx
fp = 'src/pages/AccountingSystem/components/InventoryReportModal.tsx'
replace_in_file(fp, 'const stocks = useInventoryStock();', '')

# 7. LiveUsersList.tsx
fp = 'src/pages/DutySystem/components/LiveUsersList.tsx'
replace_in_file(fp, 'const [currentTime, setCurrentTime] = useState(new Date());', '')

# 8. DutyHistoryTable.tsx
fp = 'src/pages/DutySystem/components/DutyHistoryTable.tsx'
replace_in_file(fp, 'import React, { useMemo }', 'import React')

# 9. FinanceTab.tsx
fp = 'src/pages/AccountingSystem/components/FinanceTab.tsx'
replace_in_file(fp, 'ArrowUpRight, ArrowDownRight, Clock, ArrowDown, ArrowUp', 'Clock, ArrowDown, ArrowUp')

# 10. SmartSelect.tsx
fp = 'src/components/common/SmartSelect.tsx'
replace_in_file(fp, '}, [isOpen, searchable, value]);', '}, [isOpen, searchable, value, filteredOptions]);')

print("Lint fixes applied!")
