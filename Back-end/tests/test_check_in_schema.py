import unittest

from pydantic import ValidationError

from app.schemas.check_in import CheckInCreate


class CheckInSchemaTests(unittest.TestCase):
    def payload(self, **overrides):
        values = {
            "first_name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "phone": "(832) 555-1234",
            "is_new_customer": True,
            "has_appointment": True,
            "how_heard": "Google",
        }
        values.update(overrides)
        return values

    def test_new_customer_requires_how_heard(self):
        with self.assertRaises(ValidationError):
            CheckInCreate(**self.payload(how_heard=None))

    def test_returning_customer_does_not_require_how_heard(self):
        check_in = CheckInCreate(**self.payload(is_new_customer=False, how_heard=None))

        self.assertIsNone(check_in.how_heard)

    def test_appointment_choice_is_preserved(self):
        check_in = CheckInCreate(**self.payload(has_appointment=True))

        self.assertTrue(check_in.has_appointment)


if __name__ == "__main__":
    unittest.main()
