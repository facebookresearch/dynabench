import bottle

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from string import Template

import logging

def read_template(filename):
    """
    Returns a Template object comprising the contents of the
    file specified by filename.
    """

    with open(filename, 'r', encoding='utf-8') as template_file:
        template_file_content = template_file.read()
    return Template(template_file_content)

def get_mail_session(host, port, smtp_user, smtp_secret):
    """
    Create the mail service instance
    """
    try:
        # set up the SMTP server
        server = smtplib.SMTP(host=host, port=port)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, smtp_secret)
        return server
    except Exception as e:
        logging.exception('Mail session create failure : (%s)', e)
        return None

def close_mail_session(server):
    """
    Mail session termination
    """
    # Terminate the SMTP session and close the connection
    server.quit()
    return True

def send(server=None, contacts = [], template_name = '', msg_dict = {}, subject = ''):
    """
    Mail handler to send email to specific contacts through smtp service

    """
    app = bottle.default_app()
    if not server:
        logging.error('SMTP service not empty')
        # create another smtp server handler
        server = get_mail_session(host=app.config['host'], port=app.config['port'], smtp_user=app.config['smtp_user'],
                                smtp_secret=app.config['smtp_secret'])
    try:
        server.connect()
        message_template = read_template(template_name)
        for contact in contacts:
            msg = MIMEMultipart()  # create a message
            # add in the actual person name to the message template
            message = message_template.substitute(msg_dict)
            # setup the parameters of the message
            msg['From'] = app.config['smtp_from_email_address']
            msg['To'] = contact
            msg['Subject'] = subject
            # add in the message body
            msg.attach(MIMEText(message, 'plain'))
            # send the message via the server set up earlier.
            server.send_message(msg)
            del msg
        logging.info('Email send successful (%s)', contacts)
        return True

    except Exception as message:
        logging.exception(' Mail sending failed : (%s)', message)
        return False


