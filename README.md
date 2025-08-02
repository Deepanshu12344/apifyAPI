How to Install and Run the Application

1. Clone the repository

git clone https://github.com/Deepanshu12344/apifyAPI.git
cd apifyAPI

2. Run the Backend

cd server
npm install
npm run dev

3. Run the Frontend

cd ../client
npm install
npm start

Actor Used for Testing

I used the BeautifulSoup actor from the code template:

"Example of a web scraper that uses Python HTTPX to scrape HTML from URLs provided on input, parses it using BeautifulSoup, and saves results to storage."

Assumptions and Design Choices

The app is designed to accept custom input for scraping.
It allows the user to interactively run the actor and view statistics of the scraped data.
Frontend and backend are decoupled for clarity and modularity.

Screenshots & Working Flow

![alt text](<Screenshot from 2025-08-02 14-15-55.png>) ![alt text](<Screenshot from 2025-08-02 14-16-10.png>) ![alt text](<Screenshot from 2025-08-02 14-16-41.png>)