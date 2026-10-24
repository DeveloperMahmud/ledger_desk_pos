# GitHub Push Guide (Bangla)

## প্রথমবার repository push

GitHub website-এ একটি empty repository তৈরি করুন। README, `.gitignore` বা License auto-generate করবেন না, কারণ project-এ এগুলো আগে থেকেই আছে। তারপর repository URL ব্যবহার করুন:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

GitHub password দিয়ে HTTPS push হয় না। Browser sign-in, Git Credential Manager অথবা Personal Access Token ব্যবহার করতে হবে।

## পরবর্তী update

```bash
git status
git add .
git commit -m "Describe the update"
git push
```

## Remote ভুল হলে

```bash
git remote -v
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

## Secret safety

- `.env.local`, Supabase service-role key, SMTP password বা email-worker secret commit করবেন না।
- Push-এর আগে `git status` এবং `git diff --cached` দেখুন।
- কোনো secret ভুল করে commit হলে শুধু file delete যথেষ্ট নয়; secret সঙ্গে সঙ্গে rotate করতে হবে।
