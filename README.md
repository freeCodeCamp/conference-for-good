# freeCodeCamp Conference for Good

Prerequisites            
| Prerequisite	                              | Version |
|---------------------------------------------|---------|
| [MongoDB](http://www.mongodb.org/downloads) | ~ ^3    |
| [Node.js](http://nodejs.org)                | ~ ^6    |
| npm (comes with Node)                       |	~ ^3    |


If Node or MongoDB is already installed in your machine, run the following commands to validate the versions:

node -v
mongo --version

If your versions are lower than the prerequisite versions, you should update.


### Forking The Project

#### Setting Up Your System
1. Install Git or your favorite Git client.
2. (Optional) Setup an SSH Key for GitHub.
3. Create a parent projects directory on your system.
#### Forking ConferenceForGood (CFG)
1. Go to the top level freeCodeCamp repository: https://github.com/freeCodeCamp/Conference-for-Good
2. Click the "Fork" Button in the upper right hand corner of the interface (More Details Here(https://help.github.com/articles/fork-a-repo/))
3. After the repository has been forked, you will be taken to your copy of the CFG repo at yourUsername/Conference-for-Good

#### Cloning Your Fork
1. Open a Terminal / Command Line / Bash Shell in your projects directory (i.e.: /yourprojectdirectory/)
2. Clone your fork of Conference-for-Good
```shell
$ git clone https://github.com/yourUsername/Conference-for-Good.git
```
##### (make sure to replace yourUsername with your GitHub Username)
  This will download the entire CFG repo to your projects directory.

#### Setup Your Upstream
1. Change directory to the new freeCodeCamp directory (cd Conference-for-Good)
2. Add a remote to the official CFG repo:
```shell
	$ git remote add upstream https://github.com/yzhbankov/Conference-for-Good.git
```
### Create A Branch
        Before you start working, you will need to create a separate branch specific to the issue / feature you're working on. You will push your work to this branch.
#### Naming Your Branch
Name the branch something like fix/xxx or feature/xxx where xxx is a short description of the changes or feature you are attempting to add. For example fix/email-login would be a branch where you fix something specific to email login.
#### Adding Your Branch
To create a branch on your local machine (and switch to this branch):
```shell
	$ git checkout -b [name_of_your_new_branch]
```
	and to push to GitHub:
```shell
	$ git push origin [name_of_your_new_branch]
```

## Setup ConferenceForGood
	
Before you start the application, you first need switch to database-seed-branch and install all of the dependencies:
```bash
		npm install
```
Now you will need to start MongoDB, and then seed the database, then you can start the application:
```bash
	# Start the mongo server in a separate terminal
	mongod --dbpath d:/data/db
  Next you need to start the server
	# In another terminal window to start the server
	npm run server
  Start Angular build process
	# In separate terminal window to start the Angular build process
	npm run start
  Now your application is available on http://localhost:4200/
```
