# Setting up your database

Dynabench assumes MySQL 5.7 to be installed.

## Installing MySQL

On **Mac OS X**, we recommend using [homebrew](https://docs.brew.sh/Installation) to install and run:

```
brew install mysql@5.7
brew link --force mysql@5.7
brew services start mysql@5.7
```

On **Ubuntu**, you would download the latest .deb from https://downloads.mysql.com/archives/community and install it:

```
wget https://downloads.mysql.com/archives/get/p/23/file/mysql-server_5.7.34-1ubuntu18.04_i386.deb-bundle.tar
tar xvf mysql-server_5.7.34-1ubuntu18.04_i386.deb-bundle.tar
rm *test*.deb # remove test stuff
sudo dpkg -i *.deb # this will throw some warnings about missing dependencies
sudo apt --fix-broken install # fix the dependencies
```

## Configuration

Next, we need to create a database and user for dynabench to use. Enter the MySQL shell:

```
mysql -u root -p
```

Input the following SQL commands to create the `dynabench` user:

```
CREATE USER 'dynabench'@'localhost' IDENTIFIED BY 'ENTER_YOUR_PASSWORD';
CREATE DATABASE dynabench;
USE dynabench;
```
