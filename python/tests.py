import unittest
from talk import Talk

class Test0(unittest.TestCase):

  def test_one_line(self):
    talk_string = '''
Hello World!
'''
    talk = Talk.from_string(talk_string)
    self.assertEqual(talk.talk(), 'Hello World!\n')

  def test_two_lines_no_input(self):
    talk_string = '''
Hello
World!
'''
    talk = Talk.from_string(talk_string)
    self.assertEqual(talk.talk(), 'Hello\n')
    self.assertEqual(talk.talk(), 'Hello\n')

  def test_two_lines_input(self):
    talk_string = '''
Hello
World!
'''
    talk = Talk.from_string(talk_string)
    self.assertEqual(talk.talk(), 'Hello\n')
    talk.input('')
    self.assertEqual(talk.talk(), 'World!\n')

  def test_end_of_talk(self):
    talk_string = '''
Hello World!
'''
    talk = Talk.from_string(talk_string)
    talk.input('')
    with self.assertRaises(KeyError):
      talk.input('')

if __name__ == '__main__':
  unittest.main()
