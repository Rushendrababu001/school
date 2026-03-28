# Generated migration to add device_no field to Ticket model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='ticket',
            name='device_no',
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
    ]
