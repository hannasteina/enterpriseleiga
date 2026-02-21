# Bílamyndir – Checklist

Allar myndir eiga að vera í `public/cars/` sem PNG á gegnsæjum bakgrunni.

## Sjálfvirk sókn

```bash
npx ts-node --skip-project scripts/fetch-car-images.ts
```

Ef bakgrunnur þarf að fjarlægjast:

```bash
# Þarf REMOVE_BG_API_KEY í .env.local
npx ts-node --skip-project scripts/remove-bg.ts
```

## Myndalisti (20 einstakar myndir, 28 bílar)

| Skrá | Bíll | Ár | Staða |
|------|------|----|-------|
| `kia-picanto.png` | Kia Picanto / Kia Picanto Auto | 2024 | ☐ |
| `toyota-aygo.png` | Toyota Aygo | 2023 | ☐ |
| `opel-corsa.png` | Opel Corsa | 2024 | ☐ |
| `hyundai-i30-wagon.png` | Hyundai I30 Wagon | 2023 | ☐ |
| `hyundai-i20.png` | Hyundai I20 | 2024 | ☐ |
| `hyundai-i30.png` | Hyundai I30 | 2023 | ☐ |
| `kia-ceed-sw.png` | Kia Ceed Station | 2024 | ☐ |
| `skoda-octavia-wagon.png` | Škoda Octavia Wagon | 2024 | ☐ |
| `kia-stonic.png` | Kia Stonic | 2024 | ☐ |
| `hyundai-bayon.png` | Hyundai Bayon | 2024 | ☐ |
| `dacia-duster.png` | Dacia Duster | 2023 | ☐ |
| `kia-sportage.png` | Kia Sportage PHEV / MHEV | 2024 | ☐ |
| `hyundai-tucson.png` | Hyundai Tucson PHEV | 2024 | ☐ |
| `skoda-kodiaq.png` | Škoda Kodiaq | 2024 | ☐ |
| `kia-sorento.png` | Kia Sorento PHEV | 2024 | ☐ |
| `bmw-x5.png` | BMW X5 | 2023 | ☐ |
| `volvo-xc90.png` | Volvo XC-90 PHEV | 2024 | ☐ |
| `toyota-land-cruiser.png` | Toyota Land Cruiser | 2023 | ☐ |
| `jeep-compass.png` | Jeep Compass PHEV | 2023 | ☐ |
| `jeep-renegade.png` | Jeep Renegade PHEV | 2023 | ☐ |
| `kia-niro.png` | Kia Niro PHEV | 2024 | ☐ |
| `vw-id5.png` | VW ID.5 | 2023 | ☐ |
| `tesla-model-y.png` | Tesla Model Y Long Range | 2023 | ☐ |
| `vw-transporter.png` | VW Transporter | 2024 | ☐ |
| `mercedes-sprinter.png` | Mercedes Sprinter | 2024 | ☐ |
| `ford-transit.png` | Ford Transit | 2023 | ☐ |

## Kröfur

- **Stærð:** ~800px breidd, PNG
- **Bakgrunnur:** Gegnsær (transparent)
- **Sjónarhorn:** 3/4 framan (front quarter view)
- **Litur:** Helst réttur litur bílsins, en hvítur/silfur dugar sem almenn mynd
