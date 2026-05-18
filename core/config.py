from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # БД
    database_url: str

    # Telegram
    bot_token: str
    webhook_url: str = ""

    # JWT
    secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 30

    # ЮКасса
    yukassa_shop_id: str = ""
    yukassa_secret_key: str = ""
    payment_provider_token: str = ""   # Telegram Payments provider token от ЮКасса

    # Прокси (строка через запятую → список при использовании)
    proxy_list: str = ""

    # CORS — через запятую, например: https://web.telegram.org,http://localhost:5173
    allowed_origins: str = "http://localhost:5173"

    # Playwright
    playwright_headless: bool = True

    # Лимиты тарифов
    free_tracking_limit: int = 10
    pro_tracking_limit: int = 50


settings = Settings()
