from json import dumps

from httplib2 import Http


def get_webhool_url():
    return "https://chat.googleapis.com/v1/spaces/AAAAjlROM8c/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=rGqWBLxQaigZwTBQCA5k1cBbagm3xTtF6iy9Gi7d7EY%3D"


def main():
    """Hangouts Chat incoming webhook quickstart."""

    url = get_webhool_url()

    bot_message = {
        'text': 'Incoming webhook with Python- hello from a Python script!'}

    message_headers = {'Content-Type': 'application/json; charset=UTF-8'}

    http_obj = Http()

    response = http_obj.request(
        uri=url,
        method='POST',
        headers=message_headers,
        body=dumps(bot_message),
    )

    print(response)


if __name__ == '__main__':

    main()
