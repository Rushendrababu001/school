#!/usr/bin/env python
import os
import sys

# Change to backend directory
os.chdir(r'c:\Users\administrator\Desktop\rushi\inventory\backend')

# Add to path
sys.path.insert(0, os.getcwd())

# Setup Django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

import django
django.setup()

# Run migrations
from django.core.management import call_command
try:
    print("=" * 60)
    print("Running Django migrations...")
    print("=" * 60)
    call_command('migrate', verbosity=2)
    print("\n" + "=" * 60)
    print("✓ Migrations completed successfully!")
    print("=" * 60)
except Exception as e:
    print(f"\n✗ Error during migration: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
