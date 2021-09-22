# Setting up email on dev servers

In order to get your local server to send emails, configure SES in your AWS environment:

1. Add an account via SMTP Settings in the region you will be using (do not generate keys via IAM, or you will have to re-encode the secret via a separate Python script).
2. Add the domain and/or relevant emails to identity management so that they're verified.
3. Add the relevant fields (`smtp_host`, `smtp_port`, `smtp_user`, `smtp_secret`) to your config.
4. Make sure your SES server is out of sandbox ("Sending statistics" under "Email sending") OR make sure you add your testing email addresses to SES identity management.

If you do not follow exactly these steps, you will waste a lot of time.

A simple script to test your config:

```
import smtplib
from email.mime.text import MIMEText

config = {
    'smtp_host': 'email-smtp.us-west-1.amazonaws.com',
    'smtp_port': 587,
    'smtp_secret': 'BNtB7HuYiqZHFUmcDZa1V7PFRHiw/p/cr19a9edCfI3e',
    'smtp_user': 'AKIARMY7XGTQPTNJFPA3',
}

msg = MIMEText("If you got this, that means it works!")
msg['From'] = 'no-reply@dynabench.org'
msg['To'] = 'douwekiela@gmail.com'
msg['Subject'] = 'This is a test'

server = smtplib.SMTP(host=config['smtp_host'], port=config['smtp_port'], timeout=1000)
server.ehlo()
server.starttls()
server.ehlo()
server.login(config['smtp_user'], config['smtp_secret'])
server.sendmail(msg['From'], [msg['To']], msg.as_string())
server.close()
print("Email sent. Check your inbox.")
```
