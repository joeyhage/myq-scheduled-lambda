# myq-scheduled-lambda

Using AWS EventBridge, a lambda is triggered **every hour at minute 5** to check the status of all MyQ garage doors in a MyQ account. If any garage door as been open for longer than one hour, close the garage door. 

This means the garage door may remain open up to 2 hours at a time but also may be closed after 1 hour. 

## Examples

| Opened at | Closed at | Open duration         |
| --------- | --------- | --------------------- |
| 9:05 AM   | 10:05 AM  | 1 hour                |
| 9:06 AM   | 11:05 AM  | 1 hour and 59 minutes |
