# Database setup (run after setting correct password in .env)

# 1. Edit backend/.env - set your PostgreSQL password in DATABASE_URL:
#    DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/trader_db?schema=public"
#
# 2. Create the database (in psql or pgAdmin):
#    CREATE DATABASE trader_db;
#
# 3. From backend folder run:
#    npx prisma migrate dev --name init
#    npx prisma db seed
#
# 4. Start backend:  npm run start:dev
#    Start frontend: cd ../frontend && npm run dev
