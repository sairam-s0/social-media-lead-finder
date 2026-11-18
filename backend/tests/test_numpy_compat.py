import sys
import types
import importlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import pytest
from unittest.mock import patch

def test_numpy_compat_shims_missing_attributes():
    """Verify that apply_numpy_compat fixes any missing attributes on numpy module."""
    # Create a simulated broken numpy module without 'short'
    broken_numpy = types.ModuleType("numpy")
    
    with patch.dict(sys.modules, {"numpy": broken_numpy}):
        from utils.numpy_compat import apply_numpy_compat
        apply_numpy_compat()
        
        # Verify all legacy attributes required by openpyxl exist
        assert hasattr(broken_numpy, "short")
        assert hasattr(broken_numpy, "ushort")
        assert hasattr(broken_numpy, "intc")
        assert hasattr(broken_numpy, "float16")
        assert hasattr(broken_numpy, "single")
        assert hasattr(broken_numpy, "double")
        assert hasattr(broken_numpy, "bool_")

def test_openpyxl_compat_with_broken_numpy():
    """Verify openpyxl can execute without error even if numpy lacks 'short'."""
    broken_numpy = types.ModuleType("numpy")
    
    with patch.dict(sys.modules, {"numpy": broken_numpy}):
        from utils.numpy_compat import apply_numpy_compat
        apply_numpy_compat()
        
        # Unload openpyxl.compat.numbers so it re-runs its import check
        for mod in list(sys.modules.keys()):
            if mod.startswith("openpyxl.compat"):
                del sys.modules[mod]
                
        import openpyxl.compat.numbers as numbers_compat
        assert hasattr(numbers_compat, "NUMERIC_TYPES")
        assert int in numbers_compat.NUMERIC_TYPES

def test_excel_export_service_works():
    """Verify leads export continues to work seamlessly."""
    from services.excel_exporter import generate_leads_excel_workbook
    from database.models import Lead
    
    mock_lead = Lead(
        id=1,
        source="LinkedIn",
        company_name="Test Corp",
        url="https://linkedin.com/posts/test_123",
        service="Web Development",
        content="Looking for web development agencies to build platform."
    )
    
    buf = generate_leads_excel_workbook([mock_lead], title="Test Report")
    assert buf is not None
    assert buf.getvalue()[:4] == b"PK\x03\x04"  # Valid ZIP/XLSX magic header
