import re
import os

def remove_content(filepath, pattern, is_regex=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if is_regex:
        new_content = re.sub(pattern, '', content, flags=re.MULTILINE | re.DOTALL)
    else:
        new_content = content.replace(pattern, '')
        
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

# 1. src/hooks/useUsers.ts
fp = 'src/hooks/useUsers.ts'
remove_content(fp, r"export function useUsersRealtime\(\) \{.*?\n\}\n\n", is_regex=True)
remove_content(fp, "import { useEffect } from 'react';\n")

# 2. personnelUtils.ts
fp = 'src/pages/PersonnelSystem/utils/personnelUtils.ts'
remove_content(fp, r"export interface SalaryRate \{.*?\n\}\n\n", is_regex=True)
remove_content(fp, r"export const getPositionRank = .*?\n\};\n\n", is_regex=True)

# 3. SmartSelect.tsx
fp = 'src/components/common/SmartSelect.tsx'
remove_content(fp, r"export interface SmartSelectOption \{.*?\n\}\n\n", is_regex=True)

# 4. PersonnelTable.tsx
fp = 'src/pages/PersonnelSystem/components/PersonnelTable.tsx'
remove_content(fp, r"export interface UserWithPosition \{.*?\n\}\n\n", is_regex=True)

# 5. QueueSystem/types/index.ts
fp = 'src/pages/QueueSystem/types/index.ts'
remove_content(fp, r"export interface QueueManagerLog \{.*?\n\}\n\n", is_regex=True)
remove_content(fp, r"export interface StoryLog \{.*?\n\}\n\n", is_regex=True)

# 6. SalarySystem/utils/salaryCalculations.ts
fp = 'src/pages/SalarySystem/utils/salaryCalculations.ts'
remove_content(fp, r"export interface UserPosition \{.*?\n\}\n\n", is_regex=True)

# 7. store/authStore.ts
fp = 'src/store/authStore.ts'
remove_content(fp, r"export interface User \{.*?\n\}\n\n", is_regex=True)

print("Dead code removed!")
