from rest_framework import serializers
from .models import SpanRecord, MetricRecord, LogRecord

class SpanRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpanRecord
        fields = '__all__'

class MetricRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricRecord
        fields = '__all__'

class LogRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogRecord
        fields = '__all__'
