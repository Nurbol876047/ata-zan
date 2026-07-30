import urllib.request

urls = [
    ("kaz3.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/ee/Almaty_Abay_Opera_House.jpg"),
    ("kaz4.jpg", "https://upload.wikimedia.org/wikipedia/commons/5/52/Constitution_of_the_Kazakh_SSR_%281937%29_Stamp.jpg"), # Fixed name
    ("kaz5.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/14/Emblem_of_the_Kazakh_SSR.svg"), # SVG might not render in Next.js Image without config, let's use a png
    ("kaz6.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/15/Hotel_Kazakhstan_in_Almaty.jpg"),
]

# Better URLs:
urls = [
    ("kaz3.jpg", "https://upload.wikimedia.org/wikipedia/commons/e/ee/Almaty_Abay_Opera_House.jpg"),
    ("kaz4.jpg", "https://upload.wikimedia.org/wikipedia/commons/a/ae/KAZ-2001-stamp-Constitution_Day.jpg"),
    ("kaz5.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Emblem_of_the_Kazakh_SSR.svg/800px-Emblem_of_the_Kazakh_SSR.svg.png"), # Wait, 800px is valid
    ("kaz6.jpg", "https://upload.wikimedia.org/wikipedia/commons/1/15/Hotel_Kazakhstan_in_Almaty.jpg"),
]

req_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

for name, url in urls:
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req) as response:
            with open(f"public/images/{name}", 'wb') as out_file:
                out_file.write(response.read())
        print(f"Downloaded {name}")
    except Exception as e:
        print(f"Failed {name}: {e}")
