from talk import Talk

with open('talks/talk.talk') as file:
	talkString = file.read()

talk = Talk.fromString(talkString)
talk.talk()
