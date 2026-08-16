import os

def replace_in_file(filepath, pattern, replacement):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace(pattern, replacement)
        
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

# 1. App.tsx
fp = 'src/App.tsx'
replace_in_file(fp, 'import React, { Suspense, lazy } from \'react\';', 'import React from \'react\';')

# 2. HistoryModal.tsx
fp = 'src/pages/QueueSystem/components/HistoryModal.tsx'
replace_in_file(fp, 'import { X, Filter, Inbox } from \'lucide-react\';', 'import { X, Filter } from \'lucide-react\';')

# 3. LiveUsersList.tsx
fp = 'src/pages/DutySystem/components/LiveUsersList.tsx'
replace_in_file(fp, 'import { useState } from \'react\';\n', '')

# 4. PricingSettings.tsx
fp = 'src/pages/SystemSettings/components/PricingSettings.tsx'
replace_in_file(fp, 'catch (err) {\n      alert', 'catch (err) {\n      console.error(err);\n      alert')
replace_in_file(fp, 'catch (err) {\n        alert', 'catch (err) {\n        console.error(err);\n        alert')

# 5. Portal.tsx
fp = 'src/pages/Portal.tsx'
replace_in_file(fp, '}, []);', '}, [handleAuthSession]);')

# 6. InventoryReportModal.tsx
fp = 'src/pages/AccountingSystem/components/InventoryReportModal.tsx'
replace_in_file(fp, 'import { useInventoryLogs, useInventoryStock } from \'../hooks/useAccountingQueries\';', 'import { useInventoryLogs } from \'../hooks/useAccountingQueries\';')

print("Lint fixes 2 applied!")
