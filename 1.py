import os
import base64
import requests
import json

def get_files_to_upload(hidden):
    files = []
    for root, dirs, filenames in os.walk("."):
        if not hidden:
            dirs[:] = [d for d in dirs if not d.startswith('.')]  # Skip hidden dirs
        for filename in filenames:
            if filename in ["AutoGitUploader.py", "config.json"] or filename.endswith(".bak"):
                continue  # Skip specific files
            if not hidden and filename.startswith('.'):
                continue  # Skip hidden files
            files.append(os.path.join(root, filename))
    return files

def upload_file(file_path, github_token, branch, api_url):
    with open(file_path, "rb") as file:
        content = file.read()
        encoded_content = base64.b64encode(content).decode("utf-8")

    # Fix: Use relative path without stripping leading dots
    file_name = os.path.relpath(file_path, start='.').replace("\\", "/")  # Critical change

    url = api_url + file_name
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }

    # Check if file exists
    response = requests.get(url, headers=headers)
    sha = response.json().get("sha") if response.status_code == 200 else None

    data = {
        "message": "Uploaded via automation script by Mario 🚀📂",
        "content": encoded_content,
        "branch": branch,
    }
    if sha:
        data["sha"] = sha

    response = requests.put(url, headers=headers, json=data)
    if response.status_code in [200, 201]:
        print(f"✅ Successfully uploaded {file_name}")
    else:
        print(f"❌ Failed to upload {file_name}: {response.json()}")

if __name__ == "__main__":
    with open('config.json', 'r') as f:
        config = json.load(f)
    
    api_url = f"https://api.github.com/repos/{config['GITHUB_USERNAME']}/{config['REPO_NAME']}/contents/"
    
    files_to_upload = get_files_to_upload(config['HIDDEN'])
    for file in files_to_upload:
        upload_file(
            file_path=file,
            github_token=config['GITHUB_TOKEN'],
            branch=config['BRANCH'],
            api_url=api_url
        )