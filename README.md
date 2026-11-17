# diploma-project

Дипломный проект — интернет-магазин **Skin—Clinic** (IT-SCHOOL «WEPRO»).
Вёрстка pixel perfect по макету Figma (десктоп 1920 и мобильная 390), все данные — из API песочницы `https://api.wepro.uz/sandbox-shop`.

## Страницы

| Файл | Страница | API |
|---|---|---|
| `site/index.html` | Главная: Hero, Best sellers, Shop by category, Featured products | `/products/bestsellers`, `/categories`, `/products/newest` |
| `site/products.html` | Каталог с фильтром по категории и цене | `/products?category&minPrice&maxPrice` |
| `site/product.html?id=…` | Товар, добавление в корзину, отзывы | `/products/{id}`, `POST /cart`, `POST /products/{id}/comments` |
| `site/bag.html` | Корзина и оформление заказа | `/cart`, `PATCH/DELETE /cart/{id}`, `POST /orders` |
| `site/login.html` | Вход по email и паролю | `POST /login` |
| `site/register.html` | Регистрация | `POST /register` |
| `site/profile.html` | Профиль и мои заказы, выход | `/me`, `/orders`, `POST /logout` |

## Запуск

```bash
cd site
python3 -m http.server 5500
```

Открыть http://localhost:5500

## Стек

HTML + CSS + JavaScript без сборки. Шрифты: Inter (Google Fonts), SF Pro Display (локально, `site/assets/fonts`).
