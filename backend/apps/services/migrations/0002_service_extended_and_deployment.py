from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

class Migration(migrations.Migration):

    dependencies = [
        ('services', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='environment',
            field=models.CharField(db_index=True, default='Production', max_length=32),
        ),
        migrations.AddField(
            model_name='service',
            name='owner_email',
            field=models.CharField(default='sre@flowforge.internal', max_length=128),
        ),
        migrations.AddField(
            model_name='service',
            name='slo_target_pct',
            field=models.FloatField(default=99.9),
        ),
        migrations.AddField(
            model_name='service',
            name='team',
            field=models.CharField(default='Platform Engineering', max_length=64),
        ),
        migrations.AddField(
            model_name='service',
            name='tier',
            field=models.CharField(default='Tier 1', max_length=32),
        ),
        migrations.AddField(
            model_name='service',
            name='version',
            field=models.CharField(default='v1.0.0', max_length=32),
        ),
        migrations.CreateModel(
            name='Deployment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('version', models.CharField(max_length=32)),
                ('environment', models.CharField(default='Production', max_length=32)),
                ('deployed_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('status', models.CharField(choices=[('SUCCESS', 'Success'), ('FAILED', 'Failed'), ('ROLLING_OUT', 'Rolling Out')], default='SUCCESS', max_length=16)),
                ('change_summary', models.TextField(blank=True, default='')),
                ('commit_hash', models.CharField(blank=True, default='', max_length=40)),
                ('deployed_by', models.CharField(default='CI/CD Automation', max_length=64)),
                ('service', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deployments', to='services.service')),
            ],
            options={
                'ordering': ['-deployed_at'],
            },
        ),
    ]
