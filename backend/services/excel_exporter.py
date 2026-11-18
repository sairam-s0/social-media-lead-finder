import io
from datetime import datetime
from typing import List, Dict, Any, Optional
import utils.numpy_compat
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from database.models import Lead
from utils.logging_config import logger

def generate_leads_excel_workbook(leads: List[Any], title: str = "Social Leads Report") -> io.BytesIO:
    """
    Generates a beautifully styled, professional Excel (.xlsx) workbook for leads.
    Includes summary statistics, styled header row, zebra rows, and clickable URLs.
    Returns an in-memory BytesIO object ready for emailing or HTTP download.
    """
    wb = openpyxl.Workbook()
    
    # -------------------------------------------------------------
    # Sheet 1: Discovered Leads
    # -------------------------------------------------------------
    ws_leads = wb.active
    ws_leads.title = "Discovered Leads"
    ws_leads.views.sheetView[0].showGridLines = True

    # Styling Palette
    header_fill = PatternFill(start_color="1E1B4B", end_color="1E1B4B", fill_type="solid")  # Dark Indigo
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")   # Very light slate
    status_font_new = Font(name="Calibri", size=10, bold=True, color="4338CA")
    hyperlink_font = Font(name="Calibri", size=10, color="2563EB", underline="single")
    data_font = Font(name="Calibri", size=10)
    
    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    # Title Block
    ws_leads.merge_cells("A1:K1")
    title_cell = ws_leads["A1"]
    title_cell.value = f"{title.upper()} - {datetime.utcnow().strftime('%B %d, %Y')}"
    title_cell.font = Font(name="Calibri", size=14, bold=True, color="1E1B4B")
    title_cell.alignment = Alignment(vertical="center", indent=1)
    ws_leads.row_dimensions[1].height = 30

    ws_leads.merge_cells("A2:K2")
    sub_cell = ws_leads["A2"]
    sub_cell.value = f"Total Leads Exported: {len(leads)} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
    sub_cell.font = Font(name="Calibri", size=9, italic=True, color="64748B")
    ws_leads.row_dimensions[2].height = 18

    # Empty spacer row 3
    ws_leads.row_dimensions[3].height = 10

    # Header Row (Row 4)
    headers = [
        ("ID", 8),
        ("Company Name", 24),
        ("Contact Person", 20),
        ("Contact Role", 22),
        ("Service Needed", 22),
        ("Location", 18),
        ("Status", 14),
        ("Source", 12),
        ("Matched Keywords", 24),
        ("Post URL", 32),
        ("Content / Requirement Snippet", 45),
        ("Discovered At", 16)
    ]

    header_row_idx = 4
    ws_leads.row_dimensions[header_row_idx].height = 24

    for col_idx, (header_name, min_width) in enumerate(headers, start=1):
        cell = ws_leads.cell(row=header_row_idx, column=col_idx, value=header_name)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center" if header_name in ["ID", "Status", "Source"] else "left", vertical="center")
        cell.border = thin_border

    # Data Rows
    current_row = header_row_idx + 1
    for lead in leads:
        lead_dict = lead.to_dict() if hasattr(lead, "to_dict") else (lead if isinstance(lead, dict) else {})
        
        row_values = [
            lead_dict.get("id", ""),
            lead_dict.get("company_name") or "Not provided",
            lead_dict.get("author_name") or "Not provided",
            lead_dict.get("author_role") or "Not provided",
            lead_dict.get("service") or "General",
            lead_dict.get("location") or "Not specified",
            str(lead_dict.get("status") or "new").upper(),
            lead_dict.get("source") or "LinkedIn",
            lead_dict.get("matched_keywords") or "",
            lead_dict.get("url") or "",
            (lead_dict.get("content") or lead_dict.get("title") or "")[:250].replace("\n", " "),
            (lead_dict.get("discovered_at") or "")[:10]
        ]

        ws_leads.row_dimensions[current_row].height = 20
        use_zebra = (current_row % 2 == 0)

        for col_idx, val in enumerate(row_values, start=1):
            cell = ws_leads.cell(row=current_row, column=col_idx, value=val)
            cell.font = data_font
            cell.border = thin_border
            if use_zebra:
                cell.fill = zebra_fill

            # Centering
            if headers[col_idx - 1][0] in ["ID", "Status", "Source", "Discovered At"]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            else:
                cell.alignment = Alignment(vertical="center")

            # Clickable Hyperlink for Post URL
            if headers[col_idx - 1][0] == "Post URL" and val and str(val).startswith("http"):
                cell.hyperlink = str(val)
                cell.font = hyperlink_font

            # Status pill styling
            if headers[col_idx - 1][0] == "Status" and val == "NEW":
                cell.font = status_font_new

        current_row += 1

    # Auto-adjust column widths based on defined minimums and content
    for col_idx, (_, min_width) in enumerate(headers, start=1):
        col_letter = get_column_letter(col_idx)
        ws_leads.column_dimensions[col_letter].width = min_width

    # -------------------------------------------------------------
    # Sheet 2: Summary Dashboard
    # -------------------------------------------------------------
    ws_summary = wb.create_sheet(title="Overview & Stats")
    ws_summary.views.sheetView[0].showGridLines = True

    ws_summary["A1"].value = "SOCIAL LEAD FINDER - EXECUTIVE SUMMARY"
    ws_summary["A1"].font = Font(name="Calibri", size=14, bold=True, color="1E1B4B")
    ws_summary["A2"].value = f"Export Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
    ws_summary["A2"].font = Font(name="Calibri", size=10, italic=True, color="64748B")

    # Metrics Summary Box
    metrics = [
        ("Total Leads in Report", len(leads)),
        ("New Uncontacted Leads", sum(1 for l in leads if (getattr(l, "status", None) or (l.get("status") if isinstance(l, dict) else "")) == "new")),
        ("Contacted / In Progress", sum(1 for l in leads if (getattr(l, "status", None) or (l.get("status") if isinstance(l, dict) else "")) in ["contacted", "qualified"])),
        ("Converted Clients", sum(1 for l in leads if (getattr(l, "status", None) or (l.get("status") if isinstance(l, dict) else "")) == "converted")),
    ]

    ws_summary["A4"].value = "Metric"
    ws_summary["B4"].value = "Count"
    ws_summary["A4"].font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    ws_summary["B4"].font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    ws_summary["A4"].fill = header_fill
    ws_summary["B4"].fill = header_fill

    s_row = 5
    for label, count in metrics:
        ws_summary[f"A{s_row}"].value = label
        ws_summary[f"B{s_row}"].value = count
        ws_summary[f"A{s_row}"].font = data_font
        ws_summary[f"B{s_row}"].font = Font(name="Calibri", size=11, bold=True)
        ws_summary[f"A{s_row}"].border = thin_border
        ws_summary[f"B{s_row}"].border = thin_border
        s_row += 1

    ws_summary.column_dimensions["A"].width = 30
    ws_summary.column_dimensions["B"].width = 16

    # Save to BytesIO buffer
    output_stream = io.BytesIO()
    wb.save(output_stream)
    output_stream.seek(0)
    logger.info(f"Successfully generated styled Excel workbook with {len(leads)} leads.")
    return output_stream
