import speech_recognition as sr
from pydub import AudioSegment
import io

def transcribe_audio_from_bytes(audio_bytes: bytes) -> str:
    """
    فایل صوتی که به صورت بایت دریافت شده را به متن تبدیل می‌کند.
    """
    recognizer = sr.Recognizer()

    try:
        # مرورگر فایل صوتی را معمولا با فرمت webm یا ogg ارسال می‌کند.
        # با استفاده از pydub آن را به فرمت wav تبدیل می‌کنیم که برای کتابخانه استانداردتر است.
        audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes))

        # فایل wav را در حافظه (in-memory) ایجاد می‌کنیم
        wav_io = io.BytesIO()
        audio_segment.export(wav_io, format="wav")
        wav_io.seek(0)  # برمی‌گردیم به ابتدای فایل در حافظه

        # حالا فایل wav را با کتابخانه SpeechRecognition می‌خوانیم
        with sr.AudioFile(wav_io) as source:
            audio_data = recognizer.record(source)
            
            # از سرویس تشخیص گفتار گوگل برای تبدیل به متن فارسی استفاده می‌کنیم
            # توجه: این سرویس رایگان است ولی نیاز به اینترنت دارد و محدودیت‌هایی دارد
            text = recognizer.recognize_google(audio_data, language="fa-IR")
            return text

    except sr.UnknownValueError:
        # این خطا زمانی رخ می‌دهد که سرویس نتواند گفتار را تشخیص دهد
        print("Google Speech Recognition could not understand audio")
        raise ValueError("امکان تشخیص گفتار در فایل صوتی وجود نداشت.")
    except sr.RequestError as e:
        # این خطا برای مشکلات ارتباطی با سرویس گوگل است
        print(f"Could not request results from Google Speech Recognition service; {e}")
        raise ConnectionError("سرویس تشخیص گفتار در دسترس نیست. لطفا اتصال اینترنت را بررسی کنید.")
    except Exception as e:
        # خطاهای دیگر مانند نصب نبودن ffmpeg
        print(f"An unexpected error occurred: {e}")
        raise e