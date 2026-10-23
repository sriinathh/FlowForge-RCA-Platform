from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

class Migration(migrations.Migration):

    dependencies = [
        ('incidents', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='IncidentNote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('author', models.CharField(default='SRE Lead', max_length=128)),
                ('text', models.TextField()),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('incident', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='incidents.incident')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
