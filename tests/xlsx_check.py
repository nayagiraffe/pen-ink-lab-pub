"""앱이 만든 .xlsx 를 openpyxl 로 읽어 구조와 값을 JSON 으로 출력한다 (tests/export.test.cjs 가 호출)."""
import json
import sys
import zipfile

import openpyxl

path = sys.argv[1]
with zipfile.ZipFile(path) as z:
    bad = z.testzip()           # 모든 항목의 CRC 검사: 문제 없으면 None
    names = z.namelist()

wb = openpyxl.load_workbook(path)
out = {"zipBad": bad, "names": names, "order": wb.sheetnames, "sheets": {}}
for ws in wb.worksheets:
    out["sheets"][ws.title] = {
        "rows": [[c.value for c in row] for row in ws.iter_rows()],
        "freeze": ws.freeze_panes,
        "filter": ws.auto_filter.ref,
        "widths": {k: v.width for k, v in ws.column_dimensions.items()},
        "headBold": bool(ws["A1"].font and ws["A1"].font.b),
    }
print(json.dumps(out, ensure_ascii=False))
