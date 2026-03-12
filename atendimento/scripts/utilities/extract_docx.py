import zipfile
import re
import os
import sys

# Force UTF-8 for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def get_docx_text(path):
    try:
        document = zipfile.ZipFile(path)
        xml_content = document.read('word/document.xml')
        document.close()
        
        # Decode XML
        xml_str = xml_content.decode('utf-8')
        
        # Remove XML tags to get raw text based on paragraphs
        # This is a simple regex to extract text within <w:t> tags
        text_parts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', xml_str)
        return ' '.join(text_parts)
    except Exception as e:
        return f"Error reading {path}: {str(e)}"

def main():
    folder = "Manuais OPT+z"
    if not os.path.exists(folder):
        print(f"Folder '{folder}' not found.")
        return

    with open('manuals_content_utf8.txt', 'w', encoding='utf-8') as f:
        for filename in os.listdir(folder):
            if filename.endswith(".docx") and not filename.startswith("~"):
                path = os.path.join(folder, filename)
                f.write(f"--- START FILE: {filename} ---\n")
                text = get_docx_text(path)
                # Basic cleanup
                text = text.replace('  ', ' ')
                f.write(text[:10000]) # Limit per file
                f.write(f"\n--- END FILE: {filename} ---\n\n")
    
    print("Extraction complete. Check manuals_content_utf8.txt")

if __name__ == "__main__":
    main()
