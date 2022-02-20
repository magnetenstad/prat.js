from talk import Talk

with open('talks/talk.talk') as file:
	talk_string = file.read()

talk = Talk.from_string(talk_string)
print(talk.talk())

while True:
	string = input()
	if string == 'Q':
		break
	talk.input(string)
	print(talk.talk())
