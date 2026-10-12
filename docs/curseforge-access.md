# CurseForge: доступ для ASTRA

Цель: пользователь открывает каталог и устанавливает контент без ввода API-ключа. Для официального API нужен доступ, выданный проекту ASTRA. Наличие локальных профилей или Ely.by не заменяет этот доступ.

## Подать заявку

Официальная инструкция: https://support.curseforge.com/support/solutions/articles/9000208346-about-the-curseforge-api-and-how-to-apply-for-a-key

Форма, указанная в инструкции: https://forms.monday.com/forms/dce5ccb7afda9a1c21dab1a1aa1d84eb?r=use1

Заявку заполняет владелец проекта со своими контактами и реальными сведениями. Репозиторий сейчас закрыт: ссылка сама по себе не даст проверяющим доступ к исходникам. Можно приложить описание и снимки интерфейса или предложить доступ для проверки; менять видимость репозитория для подачи заявки не требуется автоматически.

### Описание проекта для формы (английский)

ASTRA Launcher is an independently developed desktop launcher for Minecraft Java Edition, currently targeting Windows x64. It manages separate game instances, Minecraft versions and mod loaders, mod and resource pack installations, instance import/export, world backups, and game launch. It already integrates the Modrinth catalog. We are applying for CurseForge API access for ASTRA so users can discover and install CurseForge content without obtaining individual developer API keys.

The launcher supports local profiles and Ely.by accounts. A Microsoft authentication flow exists but requires registration of an application for ASTRA and has not yet been validated with a real account. CurseForge integration is currently incomplete: catalog and individual file download code require a user-provided key, while CurseForge modpack manifest installation is not yet implemented.

We intend to use the API for Minecraft project searches, project/file metadata, compatible version selection, required dependency resolution, and modpack manifest installation. Downloads will use official URLs and comply with author distribution settings. If a file is not available to third-party applications, we intend to direct users to its official CurseForge page for manual download rather than bypass the restriction. We would like guidance on the approved way to distribute API access with a desktop application and on any eligibility requirements concerning supported account types.

### Остальные сведения

- Название приложения: ASTRA Launcher.
- Репозиторий: https://github.com/Verskud/AstraLauncher (private).
- Сайт: пока отсутствует; не указывать придуманный адрес.
- Контакт, имя владельца, предполагаемое число пользователей и запросов: заполнить фактическими данными владельца.
- Попросить подтвердить допустимый способ предоставления ключа в настольном приложении. Ключ не добавлять в Git и не присылать в чат.

## После получения доступа

1. Подключить собственный доступ ASTRA согласно условиям, согласованным с CurseForge, без обязательного ввода ключа пользователем.
2. Добавить импорт CurseForge ZIP (`manifest.json`), установку указанной версии Minecraft/загрузчика и файлов с проверкой контрольных сумм.
3. Устанавливать обязательные зависимости отдельных модов с фильтрацией по версии Minecraft и загрузчику.
4. Передавать необходимую авторизацию при скачивании с CDN CurseForge. Сейчас существующий загрузчик передаёт ключ только запросам метаданных; этот путь требует доработки.
5. Для недоступных через API файлов показывать официальный способ ручной загрузки и проверять выбранный файл перед продолжением установки.
6. Проверить каталог, реальные моды и сборки, ошибки, отмену и сохранение установленных файлов с доступом ASTRA.

## Как устроен Prism

В исходниках Prism предусмотрен собственный ключ, выданный его проекту; рядом указано, что производные проекты должны использовать другой ключ. Это объясняет отсутствие обязательного поля ключа у обычного пользователя и не предоставляет ASTRA доступ к API.

Источник: https://github.com/PrismLauncher/PrismLauncher/blob/develop/CMakeLists.txt

В выпуске Prism 11.0.3 добавлена передача ключа для загрузок с CDN после изменения требований CurseForge:
https://prismlauncher.org/news/release-11.0.3/

Исследование выполнено 12 октября 2026 года. Реальный доступ API и установка сборок CurseForge пока не проверены; эта инструкция не означает, что интеграция уже работает.
