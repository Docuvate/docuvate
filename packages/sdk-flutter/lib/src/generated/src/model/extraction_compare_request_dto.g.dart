// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'extraction_compare_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExtractionCompareRequestDto extends ExtractionCompareRequestDto {
  @override
  final BuiltList<String>? engines;
  @override
  final num? maxPages;

  factory _$ExtractionCompareRequestDto(
          [void Function(ExtractionCompareRequestDtoBuilder)? updates]) =>
      (ExtractionCompareRequestDtoBuilder()..update(updates))._build();

  _$ExtractionCompareRequestDto._({this.engines, this.maxPages}) : super._();
  @override
  ExtractionCompareRequestDto rebuild(
          void Function(ExtractionCompareRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ExtractionCompareRequestDtoBuilder toBuilder() =>
      ExtractionCompareRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExtractionCompareRequestDto &&
        engines == other.engines &&
        maxPages == other.maxPages;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, engines.hashCode);
    _$hash = $jc(_$hash, maxPages.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ExtractionCompareRequestDto')
          ..add('engines', engines)
          ..add('maxPages', maxPages))
        .toString();
  }
}

class ExtractionCompareRequestDtoBuilder
    implements
        Builder<ExtractionCompareRequestDto,
            ExtractionCompareRequestDtoBuilder> {
  _$ExtractionCompareRequestDto? _$v;

  ListBuilder<String>? _engines;
  ListBuilder<String> get engines => _$this._engines ??= ListBuilder<String>();
  set engines(ListBuilder<String>? engines) => _$this._engines = engines;

  num? _maxPages;
  num? get maxPages => _$this._maxPages;
  set maxPages(num? maxPages) => _$this._maxPages = maxPages;

  ExtractionCompareRequestDtoBuilder() {
    ExtractionCompareRequestDto._defaults(this);
  }

  ExtractionCompareRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _engines = $v.engines?.toBuilder();
      _maxPages = $v.maxPages;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExtractionCompareRequestDto other) {
    _$v = other as _$ExtractionCompareRequestDto;
  }

  @override
  void update(void Function(ExtractionCompareRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ExtractionCompareRequestDto build() => _build();

  _$ExtractionCompareRequestDto _build() {
    _$ExtractionCompareRequestDto _$result;
    try {
      _$result = _$v ??
          _$ExtractionCompareRequestDto._(
            engines: _engines?.build(),
            maxPages: maxPages,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'engines';
        _engines?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ExtractionCompareRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
