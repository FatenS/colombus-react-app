# React + Vite project 

Installation -

1.- Install npm
It will create 'node_module' folder in this all dependency files will be install with this command. npm install
   ```bash
npm install
   ```

2.- Run Project
With is command file will be compiled and it will be loaded on local server `http://localhost:5173`. npm run dev
   ```bash
npm run dev    
   ```

3.- Production Build
Builds the app for production to the `build` folder. Run the following command in your terminal
   ```bash
npm run build
   ```

4.- Further help
You can learn more in the Vite Documentation To learn Vite.

Sass Compile -
1.- Install sass
Sass is an NPM package that compiles Sass to CSS (which it does very quickly too). To install node-sass run the following command in your terminal: npm add -D sass

npm add -D sass 
2.- Write sass Command
Everything is ready to write a small script in order to compile Sass. Open the package.json file in a code editor. You will see something like this:

In the scripts section add an scss command

"scripts": {
	"sass": "sass --watch src/assets/scss/main.scss src/assets/css/style.css",
},
3.- Run the Script
To execute our one-line script, we need to run the following command in the terminal: npm run sass

npm run sass
