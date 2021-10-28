# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import email.utils
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from string import Template

import bottle

from common.logging import logger


def read_template(filename):
    """
    Returns a Template object comprising the contents of the
    file specified by filename.
    """

    with open(filename, encoding="utf-8") as template_file:
        template_file_content = template_file.read()
    return Template(template_file_content)


def get_mail_session(host, port, smtp_user, smtp_secret):
    """
    Create the mail service instance
    """
    try:
        # set up the SMTP server
        server = smtplib.SMTP(host=host, port=port, timeout=1000)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, smtp_secret)
        return server
    except Exception as e:
        logger.exception(
            "Mail session could not be created - you will not be able to "
            + "send mail: (%s)",
            e,
        )
        return None


def test_SMTP_conn_open(conn):
    try:
        status = conn.noop()[0]
    except BaseException:  # smtplib.SMTPServerDisconnected
        status = -1
    return True if status == 250 else False


def close_mail_session(server):
    """
    Mail session termination
    """
    # Terminate the SMTP session and close the connection
    server.quit()
    return True


def send(
    server, config, contacts, cc_contact=None, template_name="", msg_dict={}, subject=""
):
    """
    Mail handler to send email to specific contacts through smtp service

    """
    if not test_SMTP_conn_open(server):
        logger.error("SMTP service session closed. Reconnecting the server")
        # create another smtp server handler
        server = get_mail_session(
            host=config["smtp_host"],
            port=config["smtp_port"],
            smtp_user=config["smtp_user"],
            smtp_secret=config["smtp_secret"],
        )
    try:
        message_template = read_template(template_name)
        for contact in contacts:
            msg = MIMEMultipart()  # create a message
            # add in the actual person name to the message template
            message = message_template.substitute(msg_dict)
            # setup the parameters of the message
            msg["From"] = email.utils.formataddr(
                (config["email_sender_name"], config["smtp_from_email_address"])
            )
            msg["To"] = contact
            if cc_contact is not None:
                msg["Cc"] = cc_contact
            msg["Subject"] = subject
            # add in the message body
            msg.attach(MIMEText(message, "plain"))
            # send the message via the server set up earlier.
            server.send_message(msg)
            del msg
        logger.info("Email send successful (%s)", contacts)
        return True

    except Exception as message:
        logger.exception(" Mail sending failed : (%s)", message)
        return False
