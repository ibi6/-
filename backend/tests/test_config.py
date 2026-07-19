import pytest
from pydantic import ValidationError

from app.core.config import Settings


@pytest.mark.parametrize("max_upload_mb", [0, -1, 4097])
def test_settings_reject_unsafe_upload_limits(max_upload_mb: int):
    with pytest.raises(ValidationError):
        Settings(max_upload_mb=max_upload_mb, _env_file=None)


def test_settings_reject_wildcard_cors_origin():
    with pytest.raises(ValidationError, match="CORS_ORIGINS"):
        Settings(cors_origins="*", _env_file=None)
