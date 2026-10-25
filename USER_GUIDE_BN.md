# সহজ ব্যবহার নির্দেশিকা

## প্রথমবার

1. `/setup` খুলুন।
2. ব্যবসার নাম, ধরন, ঠিকানা ও যোগাযোগের তথ্য দিন।
3. প্রয়োজনীয় module চালু করুন। পরে Settings থেকে পরিবর্তন করা যাবে।

## Inventory

- Product হলে stock হিসাব হবে; Service হলে stock লাগবে না।
- Stock in/out করার সময় কারণ লিখুন।
- পুরোনো movement edit করবেন না; correction হিসেবে নতুন adjustment দিন।
- Low stock তালিকা দেখে প্রয়োজনীয় পণ্য কিনুন।
- Labels থেকে A4 sheet print করুন।

## Client ও project

- নতুন enquiry Lead হিসেবে রাখুন।
- যোগাযোগের পরে stage পরিবর্তন করুন।
- নিশ্চিত হলে Client করুন এবং Proposal তৈরি করুন।
- Proposal accepted হলে Create project চাপুন।
- Project-এর task, milestone, file/link ও revision একই জায়গায় রাখুন।
- `Projects → project` খুলে নতুন task ও due date যোগ করুন।

## Invoice

- Create invoice থেকে client নির্বাচন করুন।
- Service ও Product একই invoice-এ রাখা যায়।
- Modern, Classic বা Minimal template বেছে নিন।
- Issue করার আগে quantity, price ও due date পরীক্ষা করুন।
- Issue হলে product stock কমবে।
- Print/PDF দিয়ে print বা PDF save করুন।
- Share দিয়ে secure online invoice link দিন।
- Cash/Bank payment এলে Record payment করুন; proof থাকলে attach করুন।

## Accounting

- Basic mode: income, expense, cash ও bank হিসাব সহজভাবে দেখুন।
- Full mode: journal, chart of accounts, trial balance ও detailed statement দেখুন।
- দুই mode একই হিসাব ব্যবহার করে; mode বদলালে amount বদলাবে না।
- Posted ভুল entry delete/edit না করে reversal দিন।

## Email

- Settings → Email templates থেকে invoice ও reminder message দেখুন।
- SMTP configure হওয়ার পরে invoice page থেকে Email দিলে outbox-এ যাবে।
- Failed email delivery log দেখে retry করা যাবে।

## Backup

- Settings → Security & backup থেকে full JSON export নিন। এতে আপনার access থাকা workspace table-গুলোর snapshot থাকবে।
- Supabase dashboard থেকে নিয়মিত database backup/export রাখুন।

## Team ও নিরাপত্তা

- `Team` থেকে email ও role নির্বাচন করে invitation তৈরি করুন। Token কেবল বিশ্বাসযোগ্য ব্যক্তিকে আলাদাভাবে দিন; invited user sign-in করে `/invite/TOKEN` খুলে accept করবে।
- Owner সবকিছু, Manager দৈনন্দিন পরিচালনা, Accountant হিসাব, Staff কাজের data, Viewer শুধু দেখা—এইভাবে role দিন।
- `Activity` থেকে গুরুত্বপূর্ণ পরিবর্তনের audit history দেখুন।
- Password ভুলে গেলে Login পেজে email লিখে `Forgot password?` চাপুন।

## Settings সহজভাবে

- `Business & brand`: নাম, ঠিকানা, ফোন, website, invoice footer, payment instruction, template ও brand color।
- `Modules`: এখন দরকার নেই এমন feature off রাখুন। Basic/Full accounting এখান থেকে বদলানো যায়।
- `Email templates`: invoice ও reminder-এর subject/body নিজের agency অনুযায়ী লিখুন।
- `Security & backup`: configuration status দেখুন এবং JSON backup নিন।

## ভবিষ্যতের business

- Branch, Purchase, Supplier, Stock Transfer, Manufacturing/BOM এবং Recurring Invoice-এর database foundation প্রস্তুত আছে।
- প্রয়োজন হলে Settings → Modules থেকে সংশ্লিষ্ট module চালু করুন। UI workflow পরের release-এ একই repository pattern-এ যোগ করা যাবে; পুরোনো inventory/invoice data বদলাতে হবে না।
