//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/dashboard_widget_input_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'replace_dashboard_layout_request_dto.g.dart';

/// ReplaceDashboardLayoutRequestDto
///
/// Properties:
/// * [widgets] 
@BuiltValue()
abstract class ReplaceDashboardLayoutRequestDto implements Built<ReplaceDashboardLayoutRequestDto, ReplaceDashboardLayoutRequestDtoBuilder> {
  @BuiltValueField(wireName: r'widgets')
  BuiltList<DashboardWidgetInputDto> get widgets;

  ReplaceDashboardLayoutRequestDto._();

  factory ReplaceDashboardLayoutRequestDto([void updates(ReplaceDashboardLayoutRequestDtoBuilder b)]) = _$ReplaceDashboardLayoutRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReplaceDashboardLayoutRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReplaceDashboardLayoutRequestDto> get serializer => _$ReplaceDashboardLayoutRequestDtoSerializer();
}

class _$ReplaceDashboardLayoutRequestDtoSerializer implements PrimitiveSerializer<ReplaceDashboardLayoutRequestDto> {
  @override
  final Iterable<Type> types = const [ReplaceDashboardLayoutRequestDto, _$ReplaceDashboardLayoutRequestDto];

  @override
  final String wireName = r'ReplaceDashboardLayoutRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReplaceDashboardLayoutRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'widgets';
    yield serializers.serialize(
      object.widgets,
      specifiedType: const FullType(BuiltList, [FullType(DashboardWidgetInputDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReplaceDashboardLayoutRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ReplaceDashboardLayoutRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'widgets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DashboardWidgetInputDto)]),
          ) as BuiltList<DashboardWidgetInputDto>;
          result.widgets.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReplaceDashboardLayoutRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReplaceDashboardLayoutRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

