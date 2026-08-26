# Skyline Travels — Full Stack

This version is ready for local testing on a Windows computer and phone.

## Easiest Windows setup
1. Install Node.js 18+.
2. Extract this ZIP.
3. Double-click `start.bat`.
4. Wait until you see `Website: http://localhost:3000`.
5. On the same computer open `http://localhost:3000`.
6. Admin is `http://localhost:3000/admin`.

## Admin login
Default local credentials:
- Username: `admin`
- Password: `ChangeMe123!`

Change these before production by creating `.env` from `.env.example`.

## Phone testing on the same Wi-Fi
The server listens on `0.0.0.0`.

1. Connect the computer and phone to the same Wi-Fi.
2. On Windows run `ipconfig` and find the computer's IPv4 address, for example `192.168.1.10`.
3. On the phone open `http://192.168.1.10:3000`.
4. Admin: `http://192.168.1.10:3000/admin`.

If Windows Firewall asks whether Node.js can communicate on the network, allow it on your private network.
v2
## What is included
- Original public website pages
- Registration form connected to the backend
- Applicant data saved locally in `data/database.json`
- Optional CV/document upload in `uploads/`
- Admin login
- Applicant search
- Applicant edit/delete
- Applicant status management
- CV download from admin
- WhatsApp number editable from admin dashboard
- Public WhatsApp button automatically uses the saved number
- Mobile-friendly admin dashboard
- `start.bat` for easy Windows startup

## Important
Applicant data is private. Use a strong admin password and HTTPS when deploying publicly. Back up the `data` and `uploads` folders.
