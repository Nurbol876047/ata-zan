import urllib.request

urls = [
    ("kazssr_3.jpg", "https://upload.wikimedia.org/wikipedia/commons/f/ff/Almaty_City_hall_%2814933845349%29.jpg"),
    ("kazssr_4.jpg", "https://upload.wikimedia.org/wikipedia/commons/8/82/Plattenbau_in_Alma-Ata%2C_1970.jpg"),
    ("kazssr_5.jpg", "https://images.unsplash.com/photo-1518080066168-d064cf449cb9?auto=format&fit=crop&w=1200&q=80"), # Brutalist architecture Unsplash
    ("kazssr_6.jpg", "https://images.unsplash.com/photo-1541460143890-449e7b2ff9eb?auto=format&fit=crop&w=1200&q=80"), # Brutalist architecture Unsplash
]

req_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
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
