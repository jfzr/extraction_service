FROM node:latest
LABEL authors="jfzr"

ENTRYPOINT ["top", "-b"]

# Create a directory for your application inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application code to the container
COPY . .

# Expose the port your application will run on
EXPOSE 3000

# Define the command to start your application
CMD [ "node", "services/api_service.js" ]