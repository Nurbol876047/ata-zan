import asyncio
import edge_tts
import json
import os

async def generate():
    os.makedirs('public/audio', exist_ok=True)
    with open('audio_tasks.json', 'r', encoding='utf-8') as f:
        tasks = json.load(f)
    
    for task in tasks:
        id_str = task['id']
        idx = task['idx']
        text = task['text']
        filename = f"public/audio/{id_str}_{idx}.mp3"
        
        if os.path.exists(filename):
            print(f"Skipping {filename}, already exists.")
            continue
            
        print(f"Generating {filename}...")
        communicate = edge_tts.Communicate(text, "kk-KZ-AigulNeural")
        await communicate.save(filename)
        
if __name__ == "__main__":
    asyncio.run(generate())
