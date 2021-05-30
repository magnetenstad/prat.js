from talk import Talk

with open('talks/talk.talk') as file:
	talkString = file.read()

talk = Talk.fromString(talkString)
print(talk.talk())

while True:
	string = input()
	if string == 'Q':
		break
	talk.input(string)
	print(talk.talk())