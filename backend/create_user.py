# create_user.py
from database import SessionLocal
from models import User
from security import get_password_hash

def create_admin_user():
    db = SessionLocal()
    try:
        # چک کردن اینکه آیا کاربری از قبل وجود دارد یا نه
        if db.query(User).count() > 0:
            print("کاربر ادمین از قبل وجود دارد. نیازی به ساخت مجدد نیست.")
            return

        print("ساخت کاربر ادمین جدید...")
        username = input("نام کاربری را وارد کنید: ")
        display_name = input("نام نمایشی را وارد کنید (مثلا: علی رضایی): ")
        password = input("رمز عبور را وارد کنید: ")
        
        hashed_password = get_password_hash(password)
        
        admin_user = User(username=username, display_name=display_name, hashed_password=hashed_password)
        
        db.add(admin_user)
        db.commit()
        
        print(f"کاربر '{username}' با موفقیت ساخته شد.")

    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()