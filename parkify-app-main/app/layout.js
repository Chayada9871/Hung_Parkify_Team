// app/layout.js or app/RootLayout.js (depending on your file structure)
import './globals.css';  // Import global Tailwind CSS styles

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <meta name="description" content="Parkify - Mobile Parking Web App" />
        <meta name="theme-color" content="#000000" />
        <title>Parkify Mobile App</title>
      </head>
      
      <body className="bg-gray-100 min-h-screen">
        {children}  {/* Render the content of individual pages here */}
      </body>
    </html>
  );
}
