# Zelos: Neo-Brutalist Exam Management Platform 🚀

**Zelos** is a full-stack, real-time exam creation, monitoring, and grading platform designed for educators who prioritize speed, integrity, and bold design. Moving away from clunky legacy systems, Zelos offers a striking Neo-Brutalist UI combined with a powerful backend to handle the end-to-end examination workflow.

---

## ✨ Key Modules

### 📝 1. Rapid Exam Creation & Management
* **Batch Uploads:** Import hundreds of questions in seconds using `.xlsx` or `.csv` templates.
* **Weighted Grading:** Assign custom point values to each question directly in the spreadsheet or through the centralized Edit Hub.
* **Flexible Templates:** Supports Multiple Choice (MC), True/False (TF), Fill-in-the-Blank (FIB), Multiple Select (MS), Short Answer, and Long Answer.
* **Duplicate & Iterate:** Clone existing exams with one click to create different versions for different classes.

### 🛡️ 2. Live Integrity Guard (Real-Time Radar)
* **Cheat Detection:** Real-time monitoring flags students who switch tabs, exit full-screen, or lose window focus.
* **Remote Controls:** Teachers can force-lock suspicious students, assign detentions, or remotely "forgive" and unlock screens.
* **Live Progress Tracking:** See exactly which question every student is currently on and their live completion percentage.

### ⚖️ 3. Smart Hybrid Grading Hub
* **Automated Evaluation:** Objective questions (MC, TF, MS) are graded instantly using database triggers.
* **Partial Credit Logic:** MS questions automatically calculate scores based on the ratio of correct selections.
* **Manual Grading Interface:** A streamlined UI for teachers to quickly review open-ended answers and assign Full, Zero, or Custom Partial credits.

### 📊 4. Centralized Results & Analytics
* **Performance Hub:** A dedicated dashboard to view class averages, individual student papers, and cheating flags.
* **Detailed Insights:** Drill down into specific student answers to identify common misconceptions.
* **One-Click Export:** Download comprehensive class results as professional `.xlsx` files.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS.
* **UI Architecture:** Custom Neo-Brutalist components (high-contrast, 8px hard shadows, rigid borders).
* **Backend & DB:** Supabase (PostgreSQL) with Realtime WebSocket subscriptions for live monitoring.
* **Logic:** PL/pgSQL Database Triggers for automated scoring and state management.
* **Payments:** Stripe API (Credit-based "Pay-per-Exam" model).
* **Data Processing:** SheetJS (`xlsx`) for spreadsheet parsing and result generation.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ 
* Supabase Account
* Stripe Account (for credits)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/zelos.git
    cd zelos
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables:**
    Create a `.env.local` file and add your credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    STRIPE_SECRET_KEY=your_stripe_secret
    ```

4.  **Database Setup:**
    Run the SQL migrations provided in the `/supabase/migrations` folder to set up tables, triggers, and RLS policies.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

---

## 🎨 UI Philosophy
Zelos utilizes **Neo-Brutalism**. It rejects the soft, blurry shadows of modern web design in favor of:
* **Bold Typography:** Heavy weights and all-caps headings.
* **High Contrast:** Pure black (#000) borders and vibrant, saturated primary colors.
* **Hard Shadows:** Consistent 4px to 12px offsets for a "stacked" physical feel.
* **Grid Backgrounds:** Radial and linear dot patterns for a technical, blueprint-like aesthetic.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
